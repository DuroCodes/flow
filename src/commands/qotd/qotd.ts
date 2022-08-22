import { ApplicationCommandOptionType } from 'discord.js';
import { SlashCommand } from '../../structures';
import { truncate } from '../../util';

export default new SlashCommand({
  name: 'qotd',
  description: 'the commands for qotds!',
  options: [
    {
      name: 'list',
      description: 'list all qotds',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'add',
      description: 'add a qotd',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'question',
          description: 'the question',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: 'edit',
      description: 'edit a qotd',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'id',
          description: 'the id of the qotd to edit',
          type: ApplicationCommandOptionType.String,
          min_length: 24,
          max_length: 24,
          required: true,
        },
        {
          name: 'question',
          description: 'the new question',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: 'delete',
      description: 'delete a qotd',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'id',
          description: 'the id of the qotd to delete',
          type: ApplicationCommandOptionType.String,
          min_length: 24,
          max_length: 24,
          required: true,
        },
      ],
    },
  ],
  async run({ client, interaction, args }) {
    const subCommand = args.getSubcommand();

    const guildData = await client.prisma.guildData.findFirst({
      where: {
        guildId: interaction.guildId!,
      },
    });

    if (!guildData) {
      return client.embeds.error({
        interaction,
        reason: 'Not setup!\nUse the `/setup` command to setup the bot.',
      });
    }

    switch (subCommand) {
      case 'edit': {
        const id = args.getString('id')!;
        const question = args.getString('question')!;

        const qotd = await client.queries.getSingleQotd(interaction.guildId!, id);
        if (!qotd) return client.embeds.error({ interaction, reason: 'That qotd does not exist!' });

        await client.prisma.qotd.update({
          where: {
            id,
          },
          data: {
            description: question,
          },
        });

        return client.embeds.success({
          interaction,
          reason: `Successfully updated the qotd!\n\n**New Question:** ${question}\n**Old Question:** ${qotd.description}`,
        });
      }
      case 'list': {
        const qotds = await client.prisma.qotd.findMany({
          where: {
            GuildData: {
              guildId: interaction.guildId!,
            },
          },
        });

        if (!qotds.length) return client.embeds.error({ interaction, reason: 'There are no qotds!' });
        return client.embeds.qotdList({ interaction, qotds });
      }
      case 'add': {
        const question = args.getString('question')!;

        const qotd = await client.queries.createQotd(
          interaction.guildId!,
          question,
          interaction.user.id,
        );

        if (!qotd) return client.embeds.error({ interaction, reason: 'There was an error creating the qotd!' });

        return client.embeds.success({
          interaction,
          reason: `Successfully added the qotd!\n\n**ID:** \`${qotd.id}\`\n**Question:** \`${truncate(question, 100)}\``,
        });
      }
      case 'delete': {
        const id = args.getString('id')!;

        const qotd = await client.queries.getSingleQotd(interaction.guildId!, id);
        if (!qotd) return client.embeds.error({ interaction, reason: 'That qotd does not exist!' });

        try {
          await client.prisma.qotd.delete({
            where: {
              id,
            },
          });
        } catch (e) {
          return client.embeds.error({ interaction, reason: 'There was an error deleting the qotd!' });
        }

        return client.embeds.success({
          interaction,
          reason: `Successfully deleted the qotd!\n\n**ID:** \`${qotd.id}\`\n**Question:** \`${truncate(qotd.description, 100)}\``,
        });
      }
      default: {
        return client.embeds.error({ interaction, reason: 'That subcommand does not exist' });
      }
    }
  },
});
