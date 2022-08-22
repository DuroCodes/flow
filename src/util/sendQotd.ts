import { EmbedBuilder, Guild, TextChannel } from 'discord.js';
import { client } from '..';

export const sendQotd = async (guild: Guild) => {
  const guildData = await client.prisma.guildData.findFirst({
    where: {
      guildId: guild.id,
    },
  });

  if (!guildData) return;

  const channel = guild.channels.cache.get(guildData.channelId) as TextChannel;
  if (!channel) return;

  const qotds = await client.prisma.qotd.findMany({
    where: {
      GuildData: {
        guildId: guild.id,
      },
    },
  });

  if (!qotds.length) return;

  const embedSettings = await client.prisma.embedSettings.findFirst({
    where: {
      GuildData: {
        guildId: guild.id,
      },
    },
  });

  if (!embedSettings) return;

  const randomQotd = qotds[Math.floor(Math.random() * qotds.length)]!;
  const member = await guild.members.fetch(randomQotd.author);

  const qotdAuthorName = member ? member.user.tag : 'Unknown';
  const qotdAuthorAvatar = member
    ? member.user.displayAvatarURL()
    : client.user?.displayAvatarURL();

  const embed = new EmbedBuilder()
    .setTitle(embedSettings.title.replace('{number}', `${guildData.qotdNumber}`))
    .setDescription(randomQotd?.description!)
    .setAuthor({ name: qotdAuthorName, iconURL: qotdAuthorAvatar! });

  await client.prisma.guildData.update({
    where: {
      guildId: guild.id,
    },
    data: {
      qotdNumber: guildData.qotdNumber + 1,
    },
  });

  await client.prisma.qotd.delete({
    where: {
      id: randomQotd.id,
    },
  });

  return channel.send({ embeds: [embed] });
};
