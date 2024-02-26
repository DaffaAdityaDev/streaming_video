import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


const checkToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid or missing token format. Please provide a valid Bearer token.',
        });
    }
    const token = authHeader.split(' ')[1];
    
    try {
        const user = await prisma.users.findFirst({
            where: {
                token,
            },
        });
        
        if (user) {
            req.user = user;
            next();
            console.log('User found:', user);
        } else {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token',
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
};

export default checkToken;
