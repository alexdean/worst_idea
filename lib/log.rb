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

    @log.formatter = ->(severity, datetime, progname, raw) do
      prefix = "#{severity[0]}, [#{datetime.strftime("%H:%M:%S.%5N")}] #{severity.rjust(6)} :"

      if raw.is_a?(Hash)
        out = ''
        col_width = raw.keys.map(&:size).max
        raw.each do |key, value|
          out += "#{prefix}   #{key.to_s.rjust(col_width)} : #{value}\n"
        end
      else
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
