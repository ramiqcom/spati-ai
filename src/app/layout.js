import './globals.css';

export const metadata = {
  title: 'SPATI.AI',
  description: 'Calculate your blue carbon',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, width: '100%', height: '100vh' }}>{children}</body>
    </html>
  )
}
