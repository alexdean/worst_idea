require 'logger'

class Log
  attr_reader :log

  [:debug, :info, :warn, :error, :fatal].each do |level|
    define_method(level) do |raw|
      @log.send(level, raw)
    end
  end

  def initialize(io, level: Logger::INFO)
    @log = Logger.new($stdout, level: Logger::DEBUG)
    @batch_mutex = Mutex.new

    # I, [2019-10-14T16:53:29.527278 #97539]  INFO -- : 0 active players.
    @log.formatter = ->(severity, datetime, progname, raw) do
      # puts "#{severity}, #{datetime}, #{progname}, #{raw}"
      # label = Logger::SEV_LABEL[severity]

      prefix = "#{severity[0]}, [#{datetime.strftime("%H:%M:%S")}] #{severity.rjust(6)} :"

      if raw.is_a?(Hash)
        out = ''
        col_width = raw.keys.map(&:size).max
        raw.each do |key, value|
          out += "#{prefix}   #{key.to_s.rjust(col_width)} : #{value}\n"
        end
      else
        puts 'not hash!'
        puts "#{raw.inspect} #{raw.class}"
        out = "#{prefix} #{raw}\n"
      end

      out
    end
  end

  def batch
    if @batch_mutex.owned? # dont lock again if we've already got the lock.
      yield
    else
      @batch_mutex.synchronize do
        yield
      end
    end
  end
end
