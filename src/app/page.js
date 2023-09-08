// Import packages
import Left from './components/left';
import Canvas from './components/canvas';
import Right from './components/right';

// Main application export
export default function Home() {  
  return (
    <div className='layout flexible vertical'>
      <Header />
      <Main />
    </div>
  )
}

// Header
function Header(){
  return (
    <div className='flexible column frame padding center center2 center3'>
      <div className='title'> SPATI.AI </div>
      <div className='title'> Blue Carbon Calculator </div>
    </div>
  )
}

// Main
function Main(){
  return (
    <div className='flexible horizontal main'>
        <Left />
        <Canvas />
        <Right />
    </div>
  )
}

