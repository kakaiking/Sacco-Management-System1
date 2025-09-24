import React, { useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { AuthContext } from "../helpers/AuthContext";

function Admin() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  return (
    <div className="dashboard">
      <header className="header">
        <div className="header__left">
          <div className="brand">
            <span className="brand__logo">S</span>
            <span className="brand__name">SACCOFLOW</span>
          </div>
          <div className="greeting">Admin</div>
        </div>
      </header>

      <main className="dashboard__content">
        <div className="card">
          <h3>Admin Overview</h3>
          <p>Use the arrow to expand and access Admin sub-menus.</p>
        </div>
      </main>
    </div>
  );
}

export default Admin;





