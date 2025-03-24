import React, { Suspense } from "react";
import Loader from "./Loader";

const LazyComponent = ({ component: Component, ...props }) => {
  return (
    <Suspense fallback={<Loader />}>
      <Component {...props} />
    </Suspense>
  );
};

export default LazyComponent;
