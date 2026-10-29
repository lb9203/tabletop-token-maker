import { render } from "preact";
import { App } from "./App";
import "./style.css";

const root = document.getElementById("app");
if (!root) throw new Error("The application root element is missing.");
render(<App />, root);
