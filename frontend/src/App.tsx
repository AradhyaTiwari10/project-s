import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Landing } from './components/Landing';
import { Omegle } from './components/Omegle';
import { Caught } from './components/Caught';
import { NotFound } from './components/NotFound';
import { Loading } from './components/Loading';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/omegle" element={<Omegle />} />
        <Route path="/caught" element={<Caught />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
