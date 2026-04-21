import { useCharacters } from '@/hooks/useCharacters';
import { useCampaignContext } from '@/hooks/useCampaignContext';
import { Plus, Search, User, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

type FilterType = 'all' | 'pc' | 'npc';
type SortType = 'name' | 'level' | 'class' | 'updated';

export default function CharacterList() {
  const { t } = useTranslation('common');
  const { t: tg } = useTranslation('gamedata');
  const { campaignSlug } = useParams<{ campaignSlug: string }>();
  const { campaignId } = useCampaignContext();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('name');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: characters = [], isLoading, error } = useCharacters(campaignId!);

  const filteredAndSortedCharacters = useMemo(() => {
    let result = characters;

    // Filter by type
    if (filterType === 'pc') {
      result = result.filter((c) => c.character_type === 'pc');
    } else if (filterType === 'npc') {
      result = result.filter((c) => c.character_type === 'npc');
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.player_name?.toLowerCase().includes(query) ||
          c.race?.toLowerCase().includes(query) ||
          c.class?.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...result];
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'level':
        sorted.sort((a, b) => b.level - a.level);
        break;
      case 'class':
        sorted.sort((a, b) => (a.class ?? '').localeCompare(b.class ?? ''));
        break;
      case 'updated':
        sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        break;
    }

    return sorted;
  }, [characters, filterType, searchQuery, sortBy]);

  const pcCount = characters.filter((c) => c.character_type === 'pc').length;
  const npcCount = characters.filter((c) => c.character_type === 'npc').length;

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-destructive">
          {t('characterList.errorLoading', { error: String(error) })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">{t('characterList.title')}</h1>
            <p className="text-muted-foreground">
              {t('characterList.subtitle', { count: characters.length })} •{' '}
              <span className="text-blue-400">{t('characterList.pcCount', { count: pcCount })}</span> •{' '}
              <span className="text-purple-400">{t('characterList.npcCount', { count: npcCount })}</span>
            </p>
          </div>
          <button
            onClick={() => navigate(`/campaign/${campaignSlug}/character/new`)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
          >
            <Plus size={20} />
            {t('buttons.addCharacter')}
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('characterList.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-ring"
            />
          </div>
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted'
              }`}
            >
              {t('characterList.allCharacters')}
            </button>
            <button
              onClick={() => setFilterType('pc')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                filterType === 'pc' ? 'bg-blue-600 text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted'
              }`}
            >
              <User size={16} />
              {t('characterList.playerCharacters')}
            </button>
            <button
              onClick={() => setFilterType('npc')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                filterType === 'npc'
                  ? 'bg-purple-600 text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted'
              }`}
            >
              <Users size={16} />
              <span>{t('characterList.npcs')}</span>
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="px-4 py-2 bg-muted border border-border text-foreground rounded-lg outline-none focus:border-ring"
          >
            <option value="name">{t('characterList.sortByName')}</option>
            <option value="level">{t('characterList.sortByLevel')}</option>
            <option value="class">{t('characterList.sortByClass')}</option>
            <option value="updated">{t('characterList.sortByRecentlyUpdated')}</option>
          </select>
        </div>

        {/* Characters Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('characterList.loading')}</p>
          </div>
        ) : filteredAndSortedCharacters.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{t('characterList.noCharactersFound')}</p>
            <button
              onClick={() => navigate(`/campaign/${campaignSlug}/character/new`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
            >
              <Plus size={20} />
              {t('buttons.createFirstCharacter')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCharacters.map((character) => (
              <div
                key={character.id}
                onClick={() => navigate(`/campaign/${campaignSlug}/character/${character.slug}`)}
                className={`p-6 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${
                  character.character_type === 'pc'
                    ? 'bg-muted border-blue-500/50 hover:border-blue-400'
                    : 'bg-muted/50 border-purple-500/30 hover:border-purple-400'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-1">{character.name}</h3>
                    {character.player_name && (
                      <p className="text-sm text-muted-foreground">
                        {t('characterList.player', { name: character.player_name })}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                      character.character_type === 'pc' ? 'bg-blue-900 text-blue-200' : 'bg-purple-900 text-purple-200'
                    }`}
                  >
                    {t(`characterType.${character.character_type}`)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('characterList.race')}</span>
                    <span className="text-foreground">
                      {character.race ? tg(`races.${character.race}`, { defaultValue: character.race }) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('characterList.class')}</span>
                    <span className="text-foreground">
                      {character.class ? tg(`classes.${character.class}`, { defaultValue: character.class }) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('characterList.level')}</span>
                    <span className="text-foreground font-semibold">{character.level}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('characterList.hp')}</span>
                    <span className="text-destructive font-semibold">{character.hit_points_max}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('characterList.ac')}</span>
                    <span className="text-cyan-400 font-semibold">{character.armor_class}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
