import { Qotd } from '@prisma/client';
import {
  CommandInteraction, PermissionResolvable, EmbedBuilder, SelectMenuInteraction, Message,
} from 'discord.js';
import { emoji, logger, truncate } from '.';

interface EmbedGeneratorOptions {
  interaction?: CommandInteraction | SelectMenuInteraction;
  message?: Message;
}

interface PermissionErrorOptions extends EmbedGeneratorOptions {
  permission: PermissionResolvable;
  user: 'I' | 'You';
}

interface BasicEmbedOptions extends EmbedGeneratorOptions {
  reason: string;
}

interface QotdListOptions extends EmbedGeneratorOptions {
  qotds: Qotd[];
}

type PunishmentEmbedOptions = {
  type: 'Ban' | 'Kick' | 'Unban';
  reason?: string;
  user: string;
} & Omit<BasicEmbedOptions, 'reason'>;

export const embedGenerator = {
  permissionError({
    interaction, permission, user, message,
  }: PermissionErrorOptions) {
    const embed = new EmbedBuilder()
      .setTitle(`${emoji.wrong} Permission Error`)
      .setColor('Red')
      .setDescription(`${user} do not have the \`${permission}\` permission`);

    if (interaction) return interaction.followUp({ embeds: [embed] });
    if (message) return message.reply({ embeds: [embed] });
    return logger.trace('The function requires you to supply an interaction or message!');
  },

  error({ interaction, reason, message }: BasicEmbedOptions) {
    const embed = new EmbedBuilder()
      .setTitle(`${emoji.wrong} Error`)
      .setColor('Red')
      .setDescription(reason);

    if (interaction) return interaction.followUp({ embeds: [embed] });
    if (message) return message.reply({ embeds: [embed] });
    return logger.trace('The function requires you to supply an interaction or message!');
  },

  success({ interaction, reason, message }: BasicEmbedOptions) {
    const embed = new EmbedBuilder()
      .setTitle(`${emoji.correct} Success`)
      .setColor('Green')
      .setDescription(reason);

    if (interaction) return interaction.followUp({ embeds: [embed] });
    if (message) return message.reply({ embeds: [embed] });
    return logger.trace('The function requires you to supply an interaction or message!');
  },

  punishment({
    interaction, type, reason, user, message,
  }: PunishmentEmbedOptions) {
    const map = {
      Unban: 'unbanned',
      Kick: 'kicked',
      Ban: 'banned',
    };

    const embed = new EmbedBuilder()
      .setTitle(`${emoji.ban} ${type}`)
      .setColor('Red')
      .setDescription(`**${user}** has been ${map[type]}${reason ? `for ${reason}` : ''}!`);

    if (interaction) return interaction.followUp({ embeds: [embed] });
    if (message) return message.reply({ embeds: [embed] });
    return logger.trace('The function requires you to supply an interaction or message!');
  },

  async qotdList({
    interaction, qotds,
  }: QotdListOptions) {
    const mappedData = qotds.map(async (qotd, i) => {
      const {
        id, description, author,
      } = qotd;

      const member = await interaction?.guild?.members.fetch(author);
      const authorName = member ? member.user.tag : 'Unknown';

      return {
        name: `Qotd #${i + 1}`,
        value: `**${emoji.author} Author**: \`${authorName}\`\n**${emoji.box} Question**: \`${truncate(description, 50)}\`\n**${emoji.ticket} ID**: \`${id}\``,
      };
    });

    if (!mappedData.length) {
      return this.error({
        interaction: interaction!, reason: 'No Qotds found!',
      });
    }

    const data = await Promise.all(mappedData);

    const embed = new EmbedBuilder()
      .setTitle(`${emoji.information} Qotd List`)
      .setColor('Green')
      .addFields(data);

    if (interaction) return interaction.followUp({ embeds: [embed] });
    return logger.trace('The function requires you to supply an interaction or message!');
  },
};
