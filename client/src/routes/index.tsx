import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import ProductDetail from '../pages/ProductDetail';
import Shop from '../pages/Shop';
import Profile from '../pages/Profile';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Checkout from '../pages/Checkout';
import OrderSuccess from '../pages/OrderSuccess';
import GoogleLoginMock from '../pages/GoogleLoginMock';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/admin/Dashboard';
import ProductsList from '../pages/admin/ProductsList';
import ProductForm from '../pages/admin/ProductForm';
import ProductView from '../pages/admin/ProductView';
import OrderView from '../pages/admin/OrderView';
import UserView from '../pages/admin/UserView';
import UsersList from '../pages/admin/UsersList';
import OrdersList from '../pages/admin/OrdersList';
import Settings from '../pages/admin/Settings';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsConditions from '../pages/TermsConditions';
import LegalPages from '../pages/admin/LegalPages';
import CategoriesList from '../pages/admin/CategoriesList';
import CategoryDetail from '../pages/admin/CategoryDetail';
import HomepageImages from '../pages/admin/HomepageImages';
import VerifyEmail from '../pages/VerifyEmail';
import ResetPassword from '../pages/ResetPassword';
import ApiMetrics from '../pages/admin/ApiMetrics';
import SendEmail from '../pages/admin/SendEmail';
import RouteErrorBoundary from '../components/common/ErrorBoundary';

const CategoryRedirect: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={slug ? `/shop?category=${encodeURIComponent(slug)}` : '/shop'} replace />;
};

export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '/',
        element: null,
      },
      {
        path: '/product/:id',
        element: <ProductDetail />,
      },
      {
        path: '/category/:slug',
        element: <CategoryRedirect />,
      },
      {
        path: '/shop',
        element: <Shop />,
      },
      {
        path: '/profile',
        element: <Profile />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/register',
        element: <Register />,
      },
      {
        path: '/checkout',
        element: <Checkout />,
      },
      {
        path: '/thank-you',
        element: <OrderSuccess />,
      },
      {
        path: '/google-login-mock',
        element: <GoogleLoginMock />,
      },
      {
        path: '/verify-email',
        element: <VerifyEmail />,
      },
      {
        path: '/reset-password',
        element: <ResetPassword />,
      },
      {
        path: '/privacy-policy',
        element: <PrivacyPolicy />,
      },
      {
        path: '/terms-conditions',
        element: <TermsConditions />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
  {
    path: '/admin',
    element: <Dashboard />,
  },
  {
    path: '/admin/products',
    element: <ProductsList />,
  },
  {
    path: '/admin/products/:id',
    element: <ProductView />,
  },
  {
    path: '/admin/products/create',
    element: <ProductForm />,
  },
  {
    path: '/admin/products/:id/edit',
    element: <ProductForm />,
  },
  {
    path: '/admin/users',
    element: <UsersList />,
  },
  {
    path: '/admin/send-email',
    element: <SendEmail />,
  },
  {
    path: '/admin/users/:id',
    element: <UserView />,
  },
  {
    path: '/admin/orders',
    element: <OrdersList />,
  },
  {
    path: '/admin/orders/:id',
    element: <OrderView />,
  },
  {
    path: '/admin/settings',
    element: <Settings />,
  },
  {
    path: '/admin/api-metrics',
    element: <ApiMetrics />,
  },
  {
    path: '/admin/categories',
    element: <CategoriesList />,
  },
  {
    path: '/admin/categories/:id',
    element: <CategoryDetail />,
  },
  {
    path: '/admin/homepage-images',
    element: <HomepageImages />,
  },
  {
    path: '/admin/legal',
    element: <LegalPages />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
