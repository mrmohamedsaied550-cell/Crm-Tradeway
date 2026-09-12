import React from 'react';
import {renderToString} from 'react-dom/server';
import assert from 'node:assert/strict';
import {Pages} from '../components/masar/pages';
import {Context,type Ctx} from '../components/masar/context';
import {actor,scoped} from '../lib/masar/engine';
import {seed} from '../lib/masar/model';
const original=seed();let count=0;
for(const aid of ['admin','tl','a1','a3','i1'])for(const view of ['dashboard','workspace','leads','leads/J-1001','inbox','calendar','bonuses','competitions','reports','distribution','partners','organization','settings','integrations','audit','approvals','guide']){const a=actor(original,aid),s=scoped(original,a);const ctx:Ctx={s,a,lang:'ar',t:ar=>ar,scope:'all',setScope:()=>{},view,go:()=>{},open:()=>{},action:async()=>s,busy:false,search:'',setSearch:()=>{},refresh:async()=>{},actorId:aid};const html=renderToString(<Context.Provider value={ctx}><Pages/></Context.Provider>);assert(html.length>0,`${aid}/${view}`);count++}
console.log(`PASS ${count} page / persona render combinations without a browser`);
