import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './layout'

const Home = lazy(() => import('./features/home').then((m) => ({ default: m.Home })))
const Blog = lazy(() => import('./features/blog').then((m) => ({ default: m.Blog })))
const BlogPost = lazy(() => import('./features/blog').then((m) => ({ default: m.BlogPost })))
const Contact = lazy(() => import('./features/contact').then((m) => ({ default: m.Contact })))
const Developer = lazy(() => import('./features/developer').then((m) => ({ default: m.Developer })))
const Project = lazy(() => import('./features/project').then((m) => ({ default: m.Project })))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'blog',
        element: <Blog />,
      },
      {
        path: 'blog/:slug',
        element: <BlogPost />,
      },
      {
        path: 'contact',
        element: <Contact />,
      },
      {
        path: 'developer',
        element: <Developer />,
      },
      {
        path: 'project',
        element: <Project />,
      },
    ],
  },
])
