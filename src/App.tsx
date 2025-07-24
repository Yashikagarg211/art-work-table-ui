
import { ArtworkTable } from './components/ArtworkTable';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import './index.css';

function App() {
  return (
    <div className="p-4">
      <h2 className="mb-4">Artworks Data Table</h2>
      <ArtworkTable />
    </div>
  );
}

export default App;

