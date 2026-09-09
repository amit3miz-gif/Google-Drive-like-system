import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import routes from './router/routes';

function renderRoutes(routeList) {
  return routeList.map((route) => {
    if (route.redirectTo) {
      return (
        <Route
          key={route.path}
          path={route.path}
          element={<Navigate to={route.redirectTo} replace />}
        />
      );
    }

    // If the route has children, render nested <Route>...</Route>
    if (route.children?.length) {
      return (
        <Route key={route.path} path={route.path} element={route.element}>
          {route.children.map((child) => (
            <Route
              key={`${route.path}-${child.path ?? 'index'}`}
              path={child.path}
              index={child.index}
              element={child.element}
            />
          ))}
        </Route>
      );
    }

    return <Route key={route.path} path={route.path} element={route.element} />;
  });
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {renderRoutes(routes)}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
