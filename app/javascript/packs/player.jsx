// Run this example by adding <%= javascript_pack_tag 'player' %> to the head of your layout file,
// like app/views/layouts/application.html.erb. All it does is render <div>Hello React</div> at the bottom
// of the page.

import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import bugsnag from '@bugsnag/js'
import bugsnagReact from '@bugsnag/plugin-react'

// TODO: import only firestore
import * as firebase from 'firebase';
var app = firebase.initializeApp({
  "apiKey": "AIzaSyCkAeXDokAKJ6RHRe1KTQUW05TLN3GPb5k",
  "authDomain": "bad-ideas.firebaseapp.com",
  "databaseURL": "https://bad-ideas.firebaseio.com",
  "projectId": "bad-ideas",
  "storageBucket": "bad-ideas.appspot.com",
  "messagingSenderId": "583188637319",
  "appId": "1:583188637319:web:1eff7887fea2e384d43a22"
});

const bugsnagClient = bugsnag('9e3bf90345d1107073f58f0705220588')
bugsnagClient.use(bugsnagReact, React)
// wrap your entire app tree in the ErrorBoundary provided
const ErrorBoundary = bugsnagClient.getPlugin('react')

const App = props => (
  <div>Hello {props.name}!</div>
)

App.defaultProps = {
  name: 'Player'
}

App.propTypes = {
  name: PropTypes.string
}

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    <ErrorBoundary>
      <App name="React" />
    </ErrorBoundary>,
    document.body.appendChild(document.createElement('div')),
  )
});

// bugsnagClient.notify(new Error('Test error'))
