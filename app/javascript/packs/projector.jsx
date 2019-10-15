// Run this example by adding <%= javascript_pack_tag 'player' %> to the head of your layout file,
// like app/views/layouts/application.html.erb. All it does is render <div>Hello React</div> at the bottom
// of the page.

import React from "react";
import ReactDOM from "react-dom";
import bugsnag from "@bugsnag/js";
import bugsnagReact from "@bugsnag/plugin-react";

// const bugsnagClient = bugsnag('9e3bf90345d1107073f58f0705220588')
// bugsnagClient.use(bugsnagReact, React)
// wrap your entire app tree in the ErrorBoundary provided
// const ErrorBoundary = bugsnagClient.getPlugin('react')
// bugsnagClient.notify(new Error('Test error'))

import ProjectorApp from "../components/Projector";

// <ErrorBoundary>
// </ErrorBoundary>
document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(
    <ProjectorApp name="React" />,
    document.body.appendChild(document.createElement("div"))
  );
});
