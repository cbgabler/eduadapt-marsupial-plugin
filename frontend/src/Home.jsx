import "./Home.css";

function Home() {
  return (
    <div className="page-container">
      <div className="home-container">
        <h1>Welcome to EHR System</h1>
        <p className="home-subtitle">
          Electronic Health Records Management System
        </p>
      </div>

      <div className="home-features">
        <div className="home-feature-card">
          <h3>Modules</h3>
          <p>Manage and start modules</p>
        </div>

        <div className="home-feature-card">
          <h3>Clinical Documentation</h3>
          <p>Document patient visits, diagnoses, and treatments</p>
        </div>

        <div className="home-feature-card">
          <h3>p</h3>
          <p>placeholder</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
