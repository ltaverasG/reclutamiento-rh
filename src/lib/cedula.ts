/**
 * Validación de cédula dominicana.
 * Traducción directa del algoritmo C# entregado por el profesor:
 *  1. Elimina los guiones.
 *  2. Exige exactamente 11 dígitos.
 *  3. Multiplica cada dígito por 1,2,1,2,1,2,1,2,1,2,1.
 *  4. Si el producto es >= 10, suma sus dos dígitos.
 *  5. La cédula es válida si el total es divisible entre 10.
 */
export function validaCedula(pCedula: string): boolean {
  const vcCedula = pCedula.replace(/-/g, '').trim()
  const digitoMult = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1]

  if (!/^\d{11}$/.test(vcCedula)) return false

  let vnTotal = 0
  for (let vDig = 0; vDig < 11; vDig++) {
    const vCalculo = Number(vcCedula[vDig]) * digitoMult[vDig]
    if (vCalculo < 10) vnTotal += vCalculo
    else vnTotal += Math.floor(vCalculo / 10) + (vCalculo % 10)
  }

  return vnTotal % 10 === 0
}

/** Deja solo los dígitos (formato en que se guarda en la base de datos). */
export function normalizaCedula(cedula: string) {
  return cedula.replace(/\D/g, '')
}
