import type { Group } from "./types/data";
import { getData } from "./data/data";
import List from "./components/list";

function App() {
  const items: Group[] = getData();
  return (
    <div className="p-8">
      <List items={items} />
    </div>
  );
}

export default App;
