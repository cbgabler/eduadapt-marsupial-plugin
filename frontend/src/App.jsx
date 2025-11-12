import RegisterForm from './RegisterForm.jsx';
import Modules from './Modules.jsx'
import './App.css';

import Dropdown from 'react-bootstrap/Dropdown';
import Nav from 'react-bootstrap/Nav';

function App() {
  return (
    <Nav
      activeKey="/home"
      onSelect={(selectedKey) => alert(`selected ${selectedKey}`)}
    >
      <Nav.Item as='li'>
        <Nav.Link href="/home">Home</Nav.Link>
      </Nav.Item>
      <Nav.Item as='li'>
        <Nav.Link href="/RegisterForm">Register</Nav.Link>
      </Nav.Item>
      <Nav.Dropdown title="SignIn" id="signin-dropdown">
        <Nav.Link href="/SignIn">SignIn</Nav.Link>
        <Nav.Link href="/SignUp">SignUp</Nav.Link>
      </Nav.Dropdown>
    </Nav>
  );
}

export default App;
