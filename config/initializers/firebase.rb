require "google/cloud/firestore"

Google::Cloud::Firestore.configure do |config|
  # config.project_id  = "my-project-id"
  config.credentials = Rails.root.join('firebase-admin-sdk-tkray-bad-ideas-106028a5b26f.json')
end
