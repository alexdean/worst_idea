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
