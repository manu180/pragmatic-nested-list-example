import type { Group } from "./types/data";
import { getData } from "./data/data";
import List from "./components/list";

function App() {
  const items: Group[] = getData();
  return (
    <div className="py-10 w-80 bg-white min-h-screen">
      <List items={items} />
    </div>
  );
}

export default App;
