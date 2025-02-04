'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sql } from '@vercel/postgres';

//const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

/* Zod es una libreria para transformar los datos obtenidos desde el form, para eviar errores de validacion. 
 * Ej: type="number" dentro de un form siempre devuelve un string. Pero para validarlo correctamente en la bd se lo transforma a numero.
 * "coerce" fuerza un cambiar (o change)   
 */
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});
   
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

 /* Para manipular muchos datos, se puede utilizar el metodo entries() con el objeto de JavaScript -> Object.fromEntries(). */
export async function createInvoice(formData: FormData) {
    try {
        const { customerId, amount, status } = CreateInvoice.parse({
            customerId: formData.get('customerId'),
            amount: formData.get('amount'),
            status: formData.get('status'),
        });
        const amountInCents = amount * 100;
        const date = new Date().toLocaleString().split(',')[0];

        await sql `INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;
    } catch (error) {
        console.error(error);
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
   
    const amountInCents = amount * 100;
   
    try {
        await sql `UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}`;
    } catch (error) {
        console.error(error);
    }
   
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    throw new Error('Failed to Delete Invoice');
    
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
}