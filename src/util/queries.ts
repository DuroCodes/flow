import { client } from '..';

export const queries = {
  async getSingleQotd(guildId: string, id: string) {
    return client.prisma.qotd.findFirst({
      where: {
        GuildData: {
          guildId,
        },
        id,
      },
    });
  },

  async createQotd(guildId: string, description: string, author: string) {
    const guildData = await client.prisma.guildData.findFirst({
      where: {
        guildId,
      },
    });

    if (!guildData) return;

    return client.prisma.qotd.create({
      data: {
        description,
        author,
        GuildData: {
          connect: {
            id: guildData.id,
          },
        },
      },
    });
  },
};
