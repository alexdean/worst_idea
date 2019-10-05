source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '2.6.3'

gem 'bootsnap', '>= 1.4.2', require: false
gem 'google-cloud-firestore'
gem 'puma', '~> 3.11'
gem 'rails', '~> 6.0.0'
gem 'random-word'
gem 'webpacker', '~> 4.0'

group :development, :test do
  gem 'byebug'
  gem 'rspec-rails'
end

group :development do
  gem 'listen', '>= 3.0.5', '< 3.2'
  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring'
  gem 'spring-watcher-listen', '~> 2.0.0'
  # Access an interactive console on exception pages or by calling 'console' anywhere in the code.
  gem 'web-console', '>= 3.3.0'
end

gem "bugsnag", "~> 6.12"
