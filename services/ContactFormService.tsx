import { ContactForm } from '@prisma/client';
import prisma from '@/libs/prisma';

export default class ContactFormService {

    private static sqlInjectionRegex = /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)|(--)|(\b(AND|OR|NOT|IS|NULL|LIKE|IN|BETWEEN|EXISTS|CASE|WHEN|THEN|END|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|HAVING|GROUP|BY|ORDER|ASC|DESC|LIMIT|OFFSET)\b)/i; // SQL injection prevention

    /**
     * Creates a new contact form with regex validation.
     * @param data - Contact form data
     * @returns The created contact form
     */
    static async createContactForm(data: {
        name: string;
        email: string;
        message: string;
        phone: string;
    }): Promise<any> {
            
            var { name, email, message, phone } = data;
    
            // Validate input
            if (!name || !email || !message) {
                throw new Error('All fields are required.');
            }
    
            // Validate input
            const existingContactForm = await prisma.contactForm.findFirst({
                where: { OR: [{ name }, { email }] },
            });
    
            if (existingContactForm) {
                throw new Error('Contact form with the same name or email already exists.');
            }
    
            // Create the contact form
            const contactForm = await prisma.contactForm.create({
                data: {
                    name,
                    email,
                    message,
                    phone,
                },
            });
    
            return contactForm;
    
        }

    /**
     * Retrieves all contact forms with optional pagination and search.
     * @param page - The page number
     * @param pageSize - The page size
     * @param search - The search query
     * @returns The contact forms and total count
     * */
    static async getAllContactForms(page: number, pageSize: number, search?: string): Promise<{ contactForms: ContactForm[], total: number }> {

        if (search && this.sqlInjectionRegex.test(search)) {
            throw new Error('Invalid search query.');
        }

        const contactForms = await prisma.contactForm.findMany({
            take: pageSize,
            skip: page * pageSize,
            where: {
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } },
                    { message: { contains: search } },
                    { phone: { contains: search } },
                ],
            },
        });

        const total = await prisma.contactForm.count();

        return { contactForms, total };
    }

    /**
     * Retrieves a contact form by its ID.
     * @param contactFormId - The contact form ID
     * @returns The contact form
     */
    static async getContactFormById(contactId: string): Promise<ContactForm | null> {
        return await prisma.contactForm.findUnique({
            where: { contactId },
        });
    }

}


