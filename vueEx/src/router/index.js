import Vue from 'vue'
import Router from 'vue-router'

import index from '@/components/index'
import about from '@/components/about'

Vue.use(Router)

const routes = [
    {
      path: '/',
      name: 'index',
      component: index
    },
    {
      path: '/about',
      name: 'about',
      component: about
    },
    // {
    //     path: '*',
    //     name: 'nopage',
    //     component: nopage
    // },
]

const router = new Router({ 
    mode:'history',
    routes
});

export default router;
