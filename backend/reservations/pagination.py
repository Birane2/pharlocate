from math import ceil

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    """
    Pagination de 10 éléments par page pour le module Réservations Pharmacien.
    Retourne : count, current_page, total_pages, next, previous, results.
    """
    page_size = 10
    page_query_param = "page"
    # Pas de page_size_query_param : taille fixe, pas de sélecteur côté client.

    def get_paginated_response(self, data):
        count = self.page.paginator.count
        total_pages = max(1, ceil(count / self.page_size))
        return Response({
            "count": count,
            "current_page": self.page.number,
            "total_pages": total_pages,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "results": data,
        })


def paginate_reservations(queryset, request, serializer_class, context=None):
    """
    Pagine un queryset avec StandardResultsSetPagination et retourne une Response DRF.
    """
    paginator = StandardResultsSetPagination()
    page = paginator.paginate_queryset(queryset, request)

    ctx = context if context is not None else {"request": request}

    if page is not None:
        serializer = serializer_class(page, many=True, context=ctx)
        return paginator.get_paginated_response(serializer.data)

    # Fallback : queryset non paginable (très rare)
    serializer = serializer_class(queryset, many=True, context=ctx)
    data = serializer.data
    return Response({
        "count": len(data),
        "current_page": 1,
        "total_pages": 1,
        "next": None,
        "previous": None,
        "results": data,
    })
