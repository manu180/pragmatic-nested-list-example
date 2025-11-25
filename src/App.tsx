import type { Group } from './types/data';
import { getData } from './data/data';
import List from './components/list';

function App() {
  const items: Group[] = getData();
  return (
    <div className="max-w-7xl mx-auto p-8 bg-white min-h-screen">
      <h1 className="text-xl text-gray-800 text-center mb-8">
        pragmatic-drag-and-drop - Nested Lists
      </h1>
      <List items={items} />
    </div>
  );
}

export default App;
