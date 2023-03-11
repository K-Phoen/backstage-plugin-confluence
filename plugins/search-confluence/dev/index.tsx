import { createDevApp } from '@backstage/dev-utils';
import { confluencePlugin } from '../src/plugin';

createDevApp().registerPlugin(confluencePlugin).render();
