namespace :admin do
  task create_game: :environment do
    if !ENV['TEMPLATE']
      puts "TEMPLATE= is required."
      exit 1
    end

    client = Google::Cloud::Firestore.new

    template_name = ENV['TEMPLATE']
    template_data = YAML.load_file(Rails.root.join("config/game_templates/#{template_name}.yml"))

    now = Time.current
    game_name = "#{now.strftime('%Y%m%d')}-#{template_name}-#{RandomWord.nouns(not_shorter_than: 4, not_longer_than: 20).next}"

    puts "creating game: '#{game_name}'"

    games = client.col('games')
    game = games.doc(game_name)
    game.set(created_at: now)

    questions = game.col('questions')
    template_data['questions'].each_with_index do |(question_text, answers), idx|
      idx += 1 # 1-based not 0-based.
      question = questions.doc(idx)
      question.set(
        sequence: idx,
        question: question_text,
        is_active: false,
        answers: answers,
        summary: {}
      )
      # question.col('player_answers').doc('placeholder').set(placeholder: 1)
    end

    # TODO: 1 player_answers collection or 1 per question?
    #   only 1: easy to listen to.
    #   1 per question: seems cleaner?
    #
    #   don't allow players to set answers for questions which aren't current.
    game.col('player_answers').doc('placeholder').set(placeholder: 1)
  end

  task next_question: :environment do
    # get current question
    # if none, current = 0
    # set all questions is_active: false
    # does question current + 1 exist? error if not.
    # set current +1 is_active: true
    # maybe a game.current_question_id reference?
  end

  task summarizer: :environment do
    if !ENV['GAME']
      puts "GAME= is required."
      exit 1
    end

    client = Google::Cloud::Firestore.new

    game_name = ENV['GAME']
    game = client.col("games/#{game_name}")

    game.col('player_answers').listen do |snapshot|
      # enumerate all the answers in the snapshot to build a summary.

      # write each summary back to the question docs.
      question = game.doc("questions/#{question_id}")
      question.set(summary: {}, merge: true)
    end
  end
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
