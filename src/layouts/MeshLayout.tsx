import './MeshLayout.css'

type MeshLayoutProps = {
    left: React.ReactNode;
    center: React.ReactNode;
    right?: React.ReactNode;
}
const MeshLayout = ({ left, center, right }: MeshLayoutProps) => {
  return (
    <div className='mesh-layout'>
        <div id='left'>{left}</div>
        <div id='center'>{center}</div>
        <div id='right'>{right}</div>
    </div>
  )
}

export default MeshLayout