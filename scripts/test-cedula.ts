// Verificación rápida del algoritmo de cédula: npm run test:cedula
import { validaCedula } from '../src/lib/cedula.ts'

const casos: [string, boolean][] = [
  ['001-0000001-7', true], // 0+0+1+0+0+0+0+0+0+2+7 = 10
  ['00100000017', true], // sin guiones
  ['001-0000004-1', true], // 4×2 = 8 → 1+8+1 = 10
  ['001-0000009-0', true], // 9×2 = 18 → 1+8 = 9; 1+9+0 = 10
  ['001-0000009-1', false], // 1+9+1 = 11
  ['001-0000001-8', false], // dígito verificador incorrecto
  ['0010000001', false], // 10 dígitos
  ['001000000189', false], // 12 dígitos
  ['abc-defghij-k', false],
  ['', false],
]

let fallos = 0
for (const [cedula, esperado] of casos) {
  const r = validaCedula(cedula)
  const ok = r === esperado
  if (!ok) fallos++
  console.log(`${ok ? '✓' : '✗'} ${cedula.padEnd(15)} → ${r} (esperado ${esperado})`)
}
process.exit(fallos ? 1 : 0)
