'use client'

// Import packages
import Left from './components/left';
import Canvas from './components/canvas';
import Right from './components/right';
import Image from 'next/image';
import logo from '../../public/logo.png';
import { useRef } from 'react';

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
      <Image 
					src={logo}
					alt="SPATI.AI" 
					height={30}
          style={{ borderRadius: '50%', border: '0.5px solid white' }}
				/>
      <div className='title'> SPATI.AI </div>
      <div className='title'> Blue Carbon Calculator </div>
    </div>
  )
}

// Main
function Main(){
  const dialogRef = useRef();

  return (
    <div className='flexible horizontal main'>
        <dialog ref={dialogRef} onClick={(e) => dialogRef.current.close() }/>
        <Left />
        <Canvas />
        <Right dialog={dialogRef} />
    </div>
  )
}

