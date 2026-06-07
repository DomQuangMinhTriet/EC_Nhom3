// src/pages/HomePage.jsx
import React from "react";
import useData from "../hooks/useData";

const HomePage = () => {
  const { data, loading, error } = useData("/api/test");

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Home Page</h1>
      <p>Welcome to the home page!</p>
      <h2>Data from API:</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default HomePage;
