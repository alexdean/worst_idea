log = Logger.new($stdout)
log.formatter = nil

namespace :admin do
  task create_game: :environment do
    # ENV['TITLE'] can be used but is optional.
    if !ENV['TEMPLATE']
      puts "TEMPLATE= is required."
      exit 1
    end

    client = Google::Cloud::Firestore.new

    template_name = ENV['TEMPLATE']
    template_data = YAML.load_file(Rails.root.join("config/game_templates/#{template_name}.yml"))

    now = Time.current
    game_name = "#{now.strftime('%Y%m%d')}-#{template_name}-#{RandomWord.nouns(not_shorter_than: 4, not_longer_than: 20).next}"

    puts "game_name='#{game_name}'"

    games = client.col('games')
    game = games.doc(game_name)
    game.set(
      title: ENV['TITLE'] || game_name,
      leader_player_id: nil,
      active_question_id: nil,
      is_joinable: true,
      created_at: now
      # these might make security rules easier to write...
      # active_player_ids: [],
      # valid_answer_ids_for_active_question: []
    )

    questions = game.col('questions')
    player_answers = game.col('player_answers')
    players = game.col('players') # nothing in here initially. just FYI it exists.

    template_data['questions'].each_with_index do |(question_text, answers), idx|
      idx += 1 # 1-based not 0-based.
      question = questions.doc(idx)
      question.set(
        sequence: idx,
        question: question_text,
        answers: answers,
        summary: {}
      )
    end

    # TODO: 1 player_answers collection or 1 per question?
    #   only 1: easy to listen to.
    #   1 per question: seems cleaner? easy to set.
    #
    #   don't allow players to set answers for questions which aren't current.
    # game.col('player_answers').doc('placeholder').set(placeholder: 1)
  end

  # how to answer a question.
  # game.col('player_answers').doc(question_id).set(player_id => answer_id, merge: true)

  task next_question: :environment do
    # get current question
    # if none, current = 0
    # set all questions is_active: false
    # does question current + 1 exist? error if not.
    # set current +1 is_active: true
    # maybe a game.current_question_id reference?

    # questions.where('sequence', '=', 1).get.first.data
    #=> {:question=>"what is?", :answers=>[1, 2, 3], :sequence=>1}
  end

  task summarizer: :environment do
    if !ENV['GAME']
      puts "GAME= is required."
      exit 1
    end

    game_name = ENV['GAME']

    client = Google::Cloud::Firestore.new
    game = client.doc("games/#{game_name}")

    max_valid_answer_ids = {}
    game.col('questions').get do |doc|
      question_id = doc.document_id
      max_valid_answer_ids[question_id] = doc.data[:answers].size - 1
    end
    valid_question_ids = Set.new(max_valid_answer_ids.keys)

    valid_players = Set.new
    # game.col('players').get do |doc|
    #   data = doc.data
    #   valid_players << data.player_id
    # end

    log.info "valid_question_ids: #{valid_question_ids.inspect}"
    # log.info "valid_players: #{valid_players.to_a.inspect}"
    log.info "max_valid_answer_ids: #{max_valid_answer_ids.inspect}"

    valid_players_mutex = Mutex.new

    players_listener = game.col('players').listen do |snapshot|
      valid_players_mutex.synchronize do
        valid_players = Set.new

        snapshot.docs.each do |doc|
          data = doc.data
          player_id = doc.document_id
          valid_players << player_id if doc[:is_active]
        end
      end
      log.info "updated player list. #{valid_players.inspect}"
    end

    # TODO: when player list changes, summaries need to be updated. (players can go from active to inactive.)

    summarizer = game.col('player_answers').listen do |snapshot|
      snapshot.docs.each do |question_doc|
        # TODO: validate that the given question exists.
        # TODO: validate that the question is open.

        summary = {}
        question_id = question_doc.document_id
        answers = question_doc.data

        if !valid_question_ids.include?(question_id)
          log.error "question_id:#{question_id} invalid."
          next
        end

        answers.each do |player_id, answer_id|
          log_context = "question_id:#{question_id}, player_id:#{player_id}, answer_id:#{answer_id}"
          if !answer_id.is_a?(Integer)
            log.error "#{log_context} not an integer"
            next
          end

          # validate that the answer id exists for this question
          if answer_id < 0 || answer_id > max_valid_answer_ids[question_id]
            log.error "#{log_context} answer out of range"
            next
          end

          # TODO: validate that this player is part of the game
          valid_players_mutex.synchronize do
            if !valid_players.include?(player_id)
              log.error "#{log_context} unknown or inactive player. valid_players:#{valid_players.inspect}"
              next
            end
          end

          summary[answer_id] ||= 0
          summary[answer_id] += 1
        end

        log.info "summarized question:#{question_id}, #{summary.inspect}"

        # update not set, to ensure that we remove outdated keys. (set with merge: true does not do this.)
        game.col("questions").doc(question_id).update({summary: summary})
      end
    end

    trap("INT") do
      @exit = 0
    end

    loop do
      break if @exit
      sleep 0.5
    end

    log.info 'exiting.'
    summarizer.stop
    players_listener.stop
  end
end


def oops
  client = Google::Cloud::Firestore.new
  game = client.doc("games/#{game_name}")
  last_snapshot = nil
  game.col('player_answers').listen { |snapshot| last_snapshot = snapshot; puts 'new data received.' }
end

# querying for answers.
#
# player_answers = game.col('player_answers')
# player_answers.add(placeholder: true)
#
# player_id = 'alex'
# player_answers.doc(player_id).set(answer_id: 1)
# questions.where('sequence', '=', 1).get.first.data
#=> {:question=>"what is?", :answers=>[1, 2, 3], :sequence=>1}
