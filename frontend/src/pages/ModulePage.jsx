import React, { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import ModuleWorkspace from '../components/ModuleWorkspace.jsx';
import RocketBayhesModule from '../modules/RocketBayhesModule.jsx';
import UavPerformance from './UavPerformance.jsx';
import { getCategory, getModule } from '../data/modules.js';

const moduleComponents = {
  RocketBayhesModule,
  UavPerformance,
};

export default function ModulePage() {
  const { categoryId, moduleId } = useParams();
  const category = getCategory(categoryId);
  const module = getModule(categoryId, moduleId);

  if (!category || !module) {
    return <Navigate to="/" replace />;
  }

  if (module.externalPath) {
    return <ExternalRedirect to={module.externalPath} />;
  }

  const Component = moduleComponents[module.component];

  return (
    <ModuleWorkspace category={category} module={module}>
      <Component />
    </ModuleWorkspace>
  );
}

function ExternalRedirect({ to }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return null;
}
