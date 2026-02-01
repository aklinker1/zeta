import dedent from "dedent";
import { app } from "./app";

app.listen(3000, () => {
  console.log(dedent`
    Integration test example started.

    - Visit http://localhost:3000 to view request history.
    - Visit other endpoints to populate the history:
       - http://localhost:3000/one
       - http://localhost:3000/two
       - http://localhost:3000/three
  `);
});
