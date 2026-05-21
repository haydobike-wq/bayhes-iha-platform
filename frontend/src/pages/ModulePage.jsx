import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import ModuleWorkspace from '../components/ModuleWorkspace.jsx';
import RocketBayhesModule from '../modules/RocketBayhesModule.jsx';
import UavPerformanceModule from '../modules/UavPerformanceModule.jsx';
import { getCategory, getModule } from '../data/modules.js';

const moduleComponents = {
  RocketBayhesModule,
  UavPerformanceModule,
};

export default function ModulePage() {
  const { categoryId, moduleId } = useParams();
  const category = getCategory(categoryId);
  const module = getModule(categoryId, moduleId);

  if (!category || !module) {
    return <Navigate to="/" replace />;
  }

  const Component = moduleComponents[module.component];

  return (
    <ModuleWorkspace category={category} module={module}>
      <Component />
    </ModuleWorkspace>
  );
}
