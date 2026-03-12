require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findFirst({ select: { id: true, email: true, firstName: true, lastName: true } });
  console.log('User:', user);
  
  const resource = await prisma.resource.findFirst({ where: { type: 'paid', status: 'published' }, select: { id: true, slug: true, price: true, currency: true, title: true } });
  console.log('Resource:', resource);

  if (!user || !resource) {
    console.log('No user or resource found');
    await prisma.$disconnect();
    return;
  }

  try {
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        resourceId: resource.id,
        amount: resource.price,
        currency: resource.currency,
        status: 'pending',
        paymentProvider: 'moneroo',
      },
    });
    console.log('Order created:', order.id);

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { monerooPaymentId: 'test_payment_id' },
    });
    console.log('Order updated with monerooPaymentId:', updated.monerooPaymentId);

    await prisma.order.delete({ where: { id: order.id } });
    console.log('Order deleted - all Prisma operations work!');
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error('FULL:', e);
  }
  
  await prisma.$disconnect();
}
test();
