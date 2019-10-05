require "google/cloud/firestore"

Google::Cloud::Firestore.configure do |config|
  config.credentials = Rails.root.join('firebase-admin-sdk-tkray-bad-ideas-106028a5b26f.json').to_s
end
