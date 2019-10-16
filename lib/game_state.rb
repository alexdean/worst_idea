require 'set'

# value object for assigning new data to a game document
#
# should raise when invalid keys or values are assigned.
class GameState
  VALID_KEYS = Set.new([
    :title,
    :current_stage,
    :leader_player_id,
    :active_question_id,
    :active_question_max_answer_id,
    :active_player_count,
    :created_at,
    :summary
  ])

  # game states
  JOINING = 'joining'
  PREPARING = 'preparing'
  QUESTION_OPEN = 'question-open'
  QUESTION_CLOSED = 'question-closed'
  QUESTION_RESULTS = 'question-results'
  FINISHED = 'finished'

  VALID_STAGES = Set.new([
    JOINING,
    PREPARING,
    QUESTION_OPEN,
    QUESTION_CLOSED,
    QUESTION_RESULTS,
    FINISHED
  ])

  def initialize(data = {})
    @data = {}
    data.each do |key, value|
      set(key, value)
    end
  end

  def set(key, val)
    raise ArgumentError, "#{key} is not a valid key." if !VALID_KEYS.include?(key)
    if key == :current_stage && !VALID_STAGES.include?(val)
      raise ArgumentError, "#{val} is not a valid value for #{key}."
    end
    @data[key] = val
  end

  def to_h
    @data
  end
end
