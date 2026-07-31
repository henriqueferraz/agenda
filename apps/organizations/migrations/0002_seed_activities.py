from django.db import migrations


def seed_activities(apps, schema_editor):
    Activity = apps.get_model("organizations", "Activity")
    defaults = (
        ("barbearia", "Barbearia", 10),
        ("cabelereiro", "Cabelereiro", 20),
        ("manicure", "Manicure", 30),
        ("maquiagem", "Maquiagem", 40),
        ("petshop", "Petshop", 50),
        ("dentistas", "Dentistas", 60),
        ("medicos", "Médicos", 70),
        (
            "outros-profissionais-liberais",
            "Outros profissionais liberais (agendamento de horários)",
            80,
        ),
    )
    for slug, name, order in defaults:
        Activity.objects.get_or_create(
            slug=slug,
            defaults={"name": name, "sort_order": order, "is_active": True},
        )


def unseed_activities(apps, schema_editor):
    Activity = apps.get_model("organizations", "Activity")
    Activity.objects.filter(
        slug__in=[
            "barbearia",
            "cabelereiro",
            "manicure",
            "maquiagem",
            "petshop",
            "dentistas",
            "medicos",
            "outros-profissionais-liberais",
        ]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_activities, unseed_activities),
    ]
