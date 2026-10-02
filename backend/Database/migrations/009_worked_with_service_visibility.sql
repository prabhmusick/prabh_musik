ALTER TABLE worked_with_artists
ADD COLUMN show_on_mix_master INTEGER NOT NULL DEFAULT 0;

ALTER TABLE worked_with_artists
ADD COLUMN show_on_lyrics INTEGER NOT NULL DEFAULT 0;

ALTER TABLE worked_with_artists
ADD COLUMN show_on_marketing_distribution INTEGER NOT NULL DEFAULT 0;