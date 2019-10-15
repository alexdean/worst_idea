Rails.application.routes.draw do
  root to: 'home#player'
  get '/projector', to: 'home#projector'
end
