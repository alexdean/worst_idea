log = Logger.new($stdout)
log.formatter = nil

namespace :admin do
  # how to answer a question.
  # game.col('player_answers').doc(question_id).set(player_id => answer_id, merge: true)

  task next_question: :environment do
    # get current question
    # if none, current = 0
    # does question current + 1 exist? error if not.
    game.set(
      active_question_id: 0,
      active_question_max_answer_id: 0
    )
    # clear the player_answers collection.

    # questions.where('sequence', '=', 1).get.first.data
    #=> {:question=>"what is?", :answers=>[1, 2, 3], :sequence=>1}
  end

  task :summarizer do
    if !ENV['GAME']
      puts "GAME= is required."
      exit 1
    end

    game_name = ENV['GAME']

    client = Google::Cloud::Firestore.new
    game = client.doc("games/#{game_name}")

    players = Set.new
    players_mutex = Mutex.new

    players_listener = game.col('players').listen do |snapshot|
      players_mutex.synchronize do
        players = Set.new

        snapshot.docs.each do |doc|
          data = doc.data
          player_id = doc.document_id
          players << player_id if doc[:is_active]
        end
      end
      log.info "updated player list. #{players.inspect}"
    end

    log.info "players: #{players.to_a.inspect}"

    game_data_mutex = Mutex.new
    game_data = nil
    game_listener = game.listen do |snapshot|
      game_data_mutex.synchronize do
        game_data = snapshot.data
      end
    end

    summarizer = game.col('player_answers').listen do |snapshot|
      active_question_id = nil
      active_question_max_answer_id = nil

      game_data_mutex.synchronize do
        active_question_id = game_data[:active_question_id]
        active_question_max_answer_id = game_data[:active_question_max_answer_id]
      end

      snapshot.docs.each do |player_doc|
        # TODO: validate that the given question exists.
        # TODO: validate that the question is open.

        summary = {}
        player_id = player_doc.document_id
        answer_id = player_doc.data[:answer]

        log_context = "active_question_id:#{active_question_id}, player_id:#{player_id}, answer_id:#{answer_id}"

        players_mutex.synchronize do
          if !players.include?(player_id)
            log.error "#{log_context} unknown or inactive player. players:#{players.inspect}"
            next
          end
        end

        if !answer_id.is_a?(Integer)
          log.error "#{log_context} not an integer"
          next
        end

        # validate that the answer id exists for this question
        if answer_id < 0 || answer_id > active_question_max_answer_id
          log.error "#{log_context} answer out of range"
          next
        end

        summary[answer_id] ||= 0
        summary[answer_id] += 1

        # update not set, to ensure that we remove outdated keys. (set with merge: true does not do this.)
        game.col("questions").doc(question_id).update({summary: summary})
        log.info "summarized question:#{question_id}, #{summary.inspect}"
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
    game_listener.stop
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
