#!/usr/bin/env node
/**
 * Generates work_items + unit_prices SQL from behavior-spec-final.md §4 (B-038–B-040).
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const westRetention = new Set([
  'direct_13',
  'direct_20',
  'direct_25',
  'direct_40',
  'indirect_13',
  'indirect_20',
  'indirect_25',
  'indirect_40',
]);

const southRetentionExtra = [
  's_dsv_13',
  's_dsv_20',
  's_dsv_25',
  's_dsv_40',
  's_isv_13',
  's_isv_20',
  's_isv_25',
  's_isv_40',
  's_sw_13',
  's_sw_20',
  's_sw_25',
  'switch_valve_40',
  's_dfix_13',
  's_dfix_20',
  's_dfix_25',
  'direct_fixed_40',
  's_ifix_13',
  's_ifix_20',
  's_ifix_25',
  'indirect_fixed_40',
];

function southAttracts(code) {
  return westRetention.has(code) || southRetentionExtra.includes(code);
}

const west = [
  ['direct_13', '直總-13', 120],
  ['direct_20', '直總-20', 120],
  ['direct_25', '直總-25', 120],
  ['direct_40', '直總-40', 170],
  ['indirect_13', '間接-13', 75],
  ['indirect_20', '間接-20', 75],
  ['indirect_25', '間接-25', 75],
  ['indirect_40', '間接-40', 125],
  ['original_change', '原改', 45],
  ['dsv_13', '直總-換由令(含表)-13', 200],
  ['dsv_20', '直總-換由令(含表)-20', 200],
  ['dsv_25', '直總-換由令(含表)-25', 200],
  ['isv_13', '間接-換由令(含表)-13', 150],
  ['isv_20', '間接-換由令(含表)-20', 150],
  ['isv_25', '間接-換由令(含表)-25', 150],
  ['sw_13', '13換開關(含表)', 320],
  ['sw_20', '20換開關(含表)', 320],
  ['sw_25', '25換開關(含表)', 320],
  ['switch_valve_40', '40換開關(含表)', 450],
  ['dfix_13', '直總-13固拆(含表)', 340],
  ['dfix_20', '直總-20固拆(含表)', 340],
  ['dfix_25', '直總-25固拆(含表)', 340],
  ['direct_fixed_40', '直總-40固拆(含表)', 500],
  ['ifix_13', '間接-13固拆(含表)', 230],
  ['ifix_20', '間接-20固拆(含表)', 230],
  ['ifix_25', '間接-25固拆(含表)', 230],
  ['indirect_fixed_40', '間接-40固拆(含表)', 450],
  ['pipe_repair', '管修(提高)', 150],
  ['mobilization', '動員', 1200],
  ['recheck', '複查案/9年表', 60],
  ['soil_clearing', '清積土', 100],
  ['app_item', 'APP', 10],
];

const south = [
  ['direct_13', '直總-13', 140],
  ['direct_20', '直總-20', 140],
  ['direct_25', '直總-25', 140],
  ['direct_40', '直總-40', 190],
  ['indirect_13', '間接-13', 90],
  ['indirect_20', '間接-20', 90],
  ['indirect_25', '間接-25', 90],
  ['indirect_40', '間接-40', 140],
  ['s_orig_13', '原改-13', 40],
  ['s_orig_20', '原改-20', 40],
  ['s_orig_25', '原改-25', 40],
  ['s_orig_40', '原改-40', 50],
  ['s_dsv_13', '直總-換由令(含表)-13', 220],
  ['s_dsv_20', '直總-換由令(含表)-20', 220],
  ['s_dsv_25', '直總-換由令(含表)-25', 220],
  ['s_dsv_40', '直總-換由令(含表)-40', 220],
  ['s_isv_13', '間接-換由令(含表)-13', 170],
  ['s_isv_20', '間接-換由令(含表)-20', 170],
  ['s_isv_25', '間接-換由令(含表)-25', 170],
  ['s_isv_40', '間接-換由令(含表)-40', 170],
  ['s_sw_13', '13換開關(含表)', 310],
  ['s_sw_20', '20換開關(含表)', 310],
  ['s_sw_25', '25換開關(含表)', 310],
  ['switch_valve_40', '40換開關(含表)', 440],
  ['s_dfix_13', '直總-13固拆(含表)', 330],
  ['s_dfix_20', '直總-20固拆(含表)', 330],
  ['s_dfix_25', '直總-25固拆(含表)', 330],
  ['direct_fixed_40', '直總-40固拆(含表)', 490],
  ['s_ifix_13', '間接-13固拆(含表)', 270],
  ['s_ifix_20', '間接-20固拆(含表)', 270],
  ['s_ifix_25', '間接-25固拆(含表)', 270],
  ['indirect_fixed_40', '間接-40固拆(含表)', 440],
  ['pipe_repair', '管修(提高)', 150],
  ['mobilization', '動員', 1200],
  ['recheck', '複查案/9年表', 70],
  ['soil_clearing', '清積土', 130],
  ['app_item', 'APP', 10],
];

const bm = [
  ['bm_50_down', '50mm下', 1100],
  ['bm_75_down', '75mm下', 1800],
  ['bm_100_down', '100mm下', 2000],
  ['bm_150_down', '150mm下', 2400],
  ['bm_200_down', '200mm下', 2800],
  ['bm_250_down', '250mm下', 3300],
  ['bm_300_down', '300mm下', 3900],
  ['bm_50_up', '50mm上', 1100],
  ['bm_75_up', '75mm上', 1700],
  ['bm_100_up', '100mm上', 1900],
  ['bm_150_up', '150mm上', 2100],
  ['bm_200_up', '200mm上', 2500],
  ['bm_250_up', '250mm上', 2700],
  ['bm_rm_screw50', '拆表/復水-螺紋50mm', 800],
  ['bm_rm_noscrew50', '拆表/復水-非螺紋50mm', 1100],
  ['bm_rm_75', '拆表/復水-75mm', 1600],
  ['bm_rm_100', '拆表/復水-100mm', 1900],
  ['bm_rm_150', '拆表/復水-150mm', 2100],
  ['bm_rm_200', '拆表/復水-200mm', 3000],
  ['bm_hole', '孔片', 500],
  ['bm_clean_big', '清箱大', 700],
  ['bm_truck', '小貨車', 700],
  ['bm_mobilization', '動員', 1200],
  ['bm_recheck', '復查', 70],
  ['bm_app', 'APP', 10],
];

function esc(s) {
  return s.replace(/'/g, "''");
}

function rows(catalogue, items, attractsFn) {
  return items.map(([code, name, price], i) => {
    const ar = attractsFn(code);
    return `  ('${esc(code)}', '${catalogue}', '${esc(name)}', ${price}, ${ar}, ${i + 1})`;
  });
}

const sql = `-- Generated from spec §4 (B-038–B-040). bm_40_fen excluded (Removed Q-007).
-- Run via seed.sql after clearing placeholder work_items.

DELETE FROM public.unit_prices;
DELETE FROM public.report_item_quantities;
DELETE FROM public.work_items;

INSERT INTO public.work_items (code, catalogue, display_name, default_price, attracts_retention, sort_order)
VALUES
${rows('WEST', west, (c) => westRetention.has(c)).join(',\n')},
${rows('SOUTH', south, southAttracts).join(',\n')},
${rows('BIG_METER', bm, () => false).join(',\n')};

INSERT INTO public.unit_prices (price_set, item_code, price)
SELECT catalogue, code, default_price FROM public.work_items;
`;

writeFileSync(join(root, 'supabase/seeds/work_items_full.sql'), sql);
console.log('Wrote supabase/seeds/work_items_full.sql');
