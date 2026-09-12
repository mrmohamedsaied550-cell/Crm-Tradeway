'use client';
import React, { createContext, useContext } from 'react';
import type { State, Agent, Command } from '@/lib/masar/model';
export type DialogSpec = {
    type: string;
    data?: Record<string, unknown>;
};
export type Ctx = {
    s: State;
    a: Agent;
    lang: 'ar' | 'en';
    t: (ar: string, en: string) => string;
    scope: string;
    setScope: (v: string) => void;
    view: string;
    go: (v: string) => void;
    open: (type: string, data?: Record<string, unknown>) => void;
    action: (c: Command) => Promise<State>;
    busy: boolean;
    search: string;
    setSearch: (v: string) => void;
    refresh: () => Promise<void>;
    actorId: string;
};
export const Context = createContext<Ctx>(null!);
export const useMasar = () => useContext(Context);
