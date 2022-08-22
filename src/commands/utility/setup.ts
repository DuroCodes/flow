import { ApplicationCommandOptionType, ChannelType, TextChannel } from 'discord.js';
import { SlashCommand } from '../../structures';

export default new SlashCommand({
  name: 'setup',
  description: 'setup the bot in your server!',
  memberPermission: 'Administrator',
  options: [
    {
      name: 'channel',
      description: 'set the channel for the bot to post to',
      type: ApplicationCommandOptionType.Channel,
      channel_types: [ChannelType.GuildText],
      required: true,
    },
  ],
  async run({ client, interaction, args }) {
    const channel = args.getChannel('channel') as TextChannel;

    const guildData = await client.prisma.guildData.findFirst({
      where: {
        guildId: interaction.guildId!,
      },
    });

    if (guildData) return client.embeds.error({ interaction, reason: 'Already setup!' });

    await client.prisma.guildData.create({
      data: {
        guildId: interaction.guildId!,
        channelId: channel.id,
      },
    });

    return client.embeds.success({
      interaction,
      reason: 'Setup complete!\nYou can now use the `/settings` command to configure the bot.',
    });
  },
});
